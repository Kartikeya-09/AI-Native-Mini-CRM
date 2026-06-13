import mongoose from 'mongoose';
import Shopper from '../models/Shopper.js';
import Order from '../models/Order.js';

function buildAggregationPipeline(filterCriteria, marketerId) {
  const pipeline = [
    {
      $match: {
        marketerId: new mongoose.Types.ObjectId(marketerId)
      }
    }
  ];

  if (!filterCriteria || !filterCriteria.clauses || filterCriteria.clauses.length === 0) {
    return pipeline;
  }

  const logic = filterCriteria.logic || 'AND';
  const clausePipelines = filterCriteria.clauses.map(clause => buildClausePipeline(clause));

  if (logic === 'AND') {
    // For AND logic, chain all the match stages
    for (const clausePipeline of clausePipelines) {
      pipeline.push(...clausePipeline);
    }
  } else if (logic === 'OR') {
    // For OR logic, use $facet to compute each clause separately, then union
    const facetStage = {};
    clausePipelines.forEach((clausePipeline, index) => {
      facetStage[`branch${index}`] = [...pipeline, ...clausePipeline];
    });
    
    pipeline.push({
      $facet: facetStage
    });

    pipeline.push({
      $project: {
        allMatches: {
          $reduce: {
            input: { $objectToArray: '$$ROOT' },
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this.v'] }
          }
        }
      }
    });

    pipeline.push({
      $unwind: '$allMatches'
    });

    pipeline.push({
      $replaceRoot: { newRoot: '$allMatches' }
    });
  }

  return pipeline;
}

function buildClausePipeline(clause) {
  switch (clause.type) {
    case 'attribute':
      return buildAttributeClause(clause);
    case 'last_order_date':
      return buildLastOrderDateClause(clause);
    case 'order_count':
      return buildOrderCountClause(clause);
    case 'total_spend':
      return buildTotalSpendClause(clause);
    case 'product_category':
      return buildProductCategoryClause(clause);
    case 'days_since_last_order':
      return buildDaysSinceLastOrderClause(clause);
     // ← ADD THESE NEW CASES
    case 'equals':
      return [{ $match: { [`attributes.${clause.field?.split('.').pop() || clause.field}`]: clause.value } }];
    case 'lastOrderDate':
      return buildLastOrderDateClause({ op: clause.operator === 'lt' ? 'before' : 'after', value: clause.value?.value || clause.value });
    case 'totalSpent':
      return buildTotalSpendClause({ min: clause.operator === 'gt' ? clause.value : undefined, max: clause.operator === 'lt' ? clause.value : undefined });
    default:
      throw new Error(`Unknown clause type: ${clause.type}`);
  }
}

function buildAttributeClause(clause) {
  const { key, op, value } = clause;
  const matchStage = {};

  if (op === 'eq') {
    matchStage[`attributes.${key}`] = value;
  } else if (op === 'contains') {
    matchStage[`attributes.${key}`] = { $regex: value, $options: 'i' };
  } else {
    throw new Error(`Unknown operator for attribute clause: ${op}`);
  }

  return [{ $match: matchStage }];
}

function buildLastOrderDateClause(clause) {
  const { op, value } = clause;
  let dateFilter;

  if (op === 'before') {
    dateFilter = { $lt: new Date(value) };
  } else if (op === 'after') {
    dateFilter = { $gt: new Date(value) };
  } else if (op === 'within_days') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(value));
    dateFilter = { $gte: cutoffDate };
  } else {
    throw new Error(`Unknown operator for last_order_date clause: ${op}`);
  }

  return [
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'shopperId',
        as: 'orders'
      }
    },
    {
      $addFields: {
        lastOrderDate: { $max: '$orders.orderedAt' }
      }
    },
    {
      $match: {
        lastOrderDate: dateFilter
      }
    }
  ];
}

function buildOrderCountClause(clause) {
  const { dateRange, min, max } = clause;
  const filterConditions = [];

  if (dateRange && dateRange.from) {
    filterConditions.push({
      $gte: ['$$order.orderedAt', new Date(dateRange.from)]  // ← $$o → $$order
    });
  }

  if (dateRange && dateRange.to) {
    filterConditions.push({
      $lte: ['$$order.orderedAt', new Date(dateRange.to)]    // ← $$o → $$order
    });
  }

  const pipeline = [
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'shopperId',
        as: 'orders'
      }
    }
  ];

  if (filterConditions.length > 0) {
    pipeline.push({
      $addFields: {
        orderCountInRange: {
          $size: {
            $filter: {
              input: '$orders',
              as: 'order',                                    // ← 'o' → 'order'
              cond: { $and: filterConditions }
            }
          }
        }
      }
    });
  } else {
    pipeline.push({
      $addFields: {
        orderCountInRange: { $size: '$orders' }
      }
    });
  }

  const matchStage = {};
  if (min !== undefined) {
    matchStage.orderCountInRange = { ...matchStage.orderCountInRange, $gte: min };
  }
  if (max !== undefined) {
    matchStage.orderCountInRange = { ...matchStage.orderCountInRange, $lte: max };
  }

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  return pipeline;
}

function buildTotalSpendClause(clause) {
  const { dateRange, min, max } = clause;
  const filterConditions = [];

  if (dateRange && dateRange.from) {
    filterConditions.push({
      $gte: ['$$order.orderedAt', new Date(dateRange.from)]  // ← $$o → $$order
    });
  }

  if (dateRange && dateRange.to) {
    filterConditions.push({
      $lte: ['$$order.orderedAt', new Date(dateRange.to)]    // ← $$o → $$order
    });
  }

  const pipeline = [
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'shopperId',
        as: 'orders'
      }
    }
  ];

  if (filterConditions.length > 0) {
    pipeline.push({
      $addFields: {
        totalSpendInRange: {
          $reduce: {
            input: {
              $filter: {
                input: '$orders',
                as: 'order',                                  // ← 'o' → 'order'
                cond: { $and: filterConditions }
              }
            },
            initialValue: 0,
            in: { $add: ['$$value', '$$this.totalAmount'] }
          }
        }
      }
    });
  } else {
    pipeline.push({
      $addFields: {
        totalSpendInRange: {
          $reduce: {
            input: '$orders',
            initialValue: 0,
            in: { $add: ['$$value', '$$this.totalAmount'] }
          }
        }
      }
    });
  }

  const matchStage = {};
  if (min !== undefined) {
    matchStage.totalSpendInRange = { ...matchStage.totalSpendInRange, $gte: min };
  }
  if (max !== undefined) {
    matchStage.totalSpendInRange = { ...matchStage.totalSpendInRange, $lte: max };
  }

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  return pipeline;
}

function buildProductCategoryClause(clause) {
  const { category, purchased } = clause;

  return [
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'shopperId',
        as: 'orders'
      }
    },
    {
      $unwind: '$orders'
    },
    {
      $unwind: '$orders.lineItems'
    },
    {
      $match: {
        'orders.lineItems.category': category
      }
    },
    {
      $group: {
        _id: '$_id',
        root: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$root' }
    }
  ];
}

function buildDaysSinceLastOrderClause(clause) {
  const { op, value } = clause;

  return [
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'shopperId',
        as: 'orders'
      }
    },
    {
      $addFields: {
        lastOrderDate: { $max: '$orders.orderedAt' }
      }
    },
    {
      $addFields: {
        daysSinceLastOrder: {
          $dateDiff: {
            startDate: '$lastOrderDate',
            endDate: '$$NOW',
            unit: 'day'
          }
        }
      }
    },
    {
      $match: {
        daysSinceLastOrder: op === 'gt' ? { $gt: value } : { $lt: value }
      }
    }
  ];
}

async function evaluateSegment(filterCriteria, marketerId) {
  const pipeline = buildAggregationPipeline(filterCriteria, marketerId);

  console.log('Segment pipeline:', JSON.stringify(pipeline, null, 2));

  const results = await Shopper.aggregate(pipeline);
  const shopperIds = results.map(shopper => shopper._id);
  const matchingCount = shopperIds.length;

  console.log('Segment results:', matchingCount, 'shoppers matched');

  return { matchingCount, shopperIds };
}

export {
  buildAggregationPipeline,
  evaluateSegment
};


import { OrderDirection, OrderMapper } from '@raynode/graphql-connector'

export type OrderResult = [[string, OrderDirection]]

export const orderMapper: OrderMapper<OrderResult> = (field, direction = 'ASC') => {
  console.log('ordering by:', field)
  return [[field || 'id', direction]]
}

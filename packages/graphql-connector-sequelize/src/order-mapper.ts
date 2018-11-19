
import { OrderDirection, OrderMapper } from '@raynode/graphql-connector'

export type OrderResult = [[string, OrderDirection]]

export const orderMapper: OrderMapper<OrderResult> = (field, direction = 'ASC') => [[field || 'id', direction]]

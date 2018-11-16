export type OrderDirection = 'DESC' | 'ASC'

export type OrderMapper<Result> = (field: string, order: OrderDirection) => Result

export const defaultOrderMapper: OrderMapper<{ [key: string]: OrderDirection }> = (field, order) => ({ field: order })

export const applyOrderMapper = <Result>(orderMapper: OrderMapper<Result>) => (order: string) =>
  orderMapper(...(order.split('_') as [string, OrderDirection]))

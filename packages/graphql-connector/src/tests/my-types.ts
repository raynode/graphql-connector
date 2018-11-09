// tslint:disable:max-classes-per-file

export class DBType {}

export class DBIntType extends DBType {
  private type: number
}
export class DBIDType extends DBType {
  private type: string
  public constructor(
    public source: string,
    public sourceAttribute: string = 'id',
    public target: string = null,
    public targetAttribute: string = 'id',
  ) {
    super()
  }
}
export class DBStringType extends DBType {
  private type: string
}
export class DBDateType extends DBType {
  private type: Date
}
export class DBListType extends DBType {
  private type: any[]
  public constructor(public subtype: DBType) {
    super()
  }
}

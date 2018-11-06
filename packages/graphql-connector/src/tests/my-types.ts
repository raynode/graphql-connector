// tslint:disable:max-classes-per-file

export class DBType {}

export class DBIntType extends DBType {}
export class DBIDType extends DBType {
  public constructor(public source: string) {
    super()
  }
}
export class DBStringType extends DBType {}
export class DBDateType extends DBType {}
export class DBListType extends DBType {
  public constructor(public subtype: DBType) {
    super()
  }
}

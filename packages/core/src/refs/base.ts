import { SchemaTypes } from '../types';

export default class BaseTypeRef<Types extends SchemaTypes>
  implements PothosSchemaTypes.BaseTypeRef<Types>
{
  kind;

  name;

  constructor(
    kind:
      | 'Enum'
      | 'InputObject'
      | 'Interface'
      | 'Object'
      | 'Scalar'
      | 'Union'
      | 'List'
      | 'InputList',
    name: string,
  ) {
    this.kind = kind;
    this.name = name;
  }

  toString() {
    return `${this.kind}Ref<${this.name}>`;
  }
}

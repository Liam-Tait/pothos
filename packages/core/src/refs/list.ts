import { outputShapeKey, parentShapeKey, SchemaTypes, TypeParam } from '../types';
import BaseTypeRef from './base';

export default class ListRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types>
  implements PothosSchemaTypes.ListRef<Types, T, P>
{
  override kind = 'List' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  listType: TypeParam<Types>;
  nullable: boolean;

  constructor(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    listType: TypeParam<Types>,
    nullable: boolean,
  ) {
    super(builder, 'List', `List<${String(listType)}>`);
    this.listType = listType;
    this.nullable = nullable;
  }
}

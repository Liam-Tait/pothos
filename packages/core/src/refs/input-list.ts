import { inputShapeKey, InputTypeParam, SchemaTypes } from '../types';
import BaseTypeRef from './base';

export default class InputListRef<Types extends SchemaTypes, T>
  extends BaseTypeRef<Types>
  implements PothosSchemaTypes.InputListRef<Types, T>
{
  override kind = 'InputList' as const;

  [inputShapeKey]!: T;
  listType: InputTypeParam<Types>;
  required: boolean;

  constructor(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    listType: InputTypeParam<Types>,
    required: boolean,
  ) {
    super(builder, 'InputList', `InputList<${String(listType)}>`);
    this.listType = listType;
    this.required = required;
  }
}

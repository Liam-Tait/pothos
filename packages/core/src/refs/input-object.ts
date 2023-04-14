/* eslint-disable max-classes-per-file */
import {
  InputFieldsFromShape,
  InputRef,
  inputShapeKey,
  PothosInputObjectTypeConfig,
  RecursivelyNormalizeNullableFields,
  SchemaTypes,
} from '../types';
import BaseTypeRef from './base';

export default class InputObjectRef<Types extends SchemaTypes, T>
  extends BaseTypeRef<Types, PothosInputObjectTypeConfig>
  implements InputRef<T>, PothosSchemaTypes.InputObjectRef<Types, T>
{
  override kind = 'InputObject' as const;

  [inputShapeKey]!: T;

  constructor(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    name: string,
    config?: PothosInputObjectTypeConfig,
  ) {
    super(builder, 'InputObject', name, config);
  }
}

export class ImplementableInputObjectRef<
  Types extends SchemaTypes,
  T extends object,
> extends InputObjectRef<Types, RecursivelyNormalizeNullableFields<T>> {
  implement(
    options: PothosSchemaTypes.InputObjectTypeOptions<
      Types,
      InputFieldsFromShape<Types, RecursivelyNormalizeNullableFields<T>, 'InputObject'>
    >,
  ) {
    this.builder.inputType<
      ImplementableInputObjectRef<Types, T>,
      InputFieldsFromShape<Types, RecursivelyNormalizeNullableFields<T>, 'InputObject'>
    >(this, options);

    return this as InputObjectRef<Types, T>;
  }
}

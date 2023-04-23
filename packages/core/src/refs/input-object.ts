/* eslint-disable max-classes-per-file */
import {
  InputFieldsFromShape,
  InputRef,
  inputShapeKey,
  PothosInputObjectTypeConfig,
  RecursivelyNormalizeNullableFields,
  SchemaTypes,
} from '../types';
import { BaseTypeRef } from './base';

export class InputObjectRef<Types extends SchemaTypes, T>
  extends BaseTypeRef<Types, PothosInputObjectTypeConfig>
  implements InputRef<T>, PothosSchemaTypes.InputObjectRef<Types, T>
{
  override kind = 'InputObject' as const;

  [inputShapeKey]!: T;

  constructor(name: string) {
    super('InputObject', name);
  }
}

export class ImplementableInputObjectRef<
  Types extends SchemaTypes,
  T extends object,
> extends InputObjectRef<Types, RecursivelyNormalizeNullableFields<T>> {
  builder: PothosSchemaTypes.SchemaBuilder<Types>;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) {
    super(name);
    this.builder = builder;
  }

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

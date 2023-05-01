/* eslint-disable max-classes-per-file */
import { PothosSchemaError } from '../errors';
import {
  InputFieldMap,
  InputFieldsFromShape,
  InputRef,
  inputShapeKey,
  PothosInputFieldConfig,
  PothosInputObjectTypeConfig,
  RecursivelyNormalizeNullableFields,
  SchemaTypes,
} from '../types';
import { BaseTypeRef } from './base';
import { InputFieldRef } from './input-field';

export class InputObjectRef<Types extends SchemaTypes, T>
  extends BaseTypeRef<Types, PothosInputObjectTypeConfig>
  implements InputRef<T>, PothosSchemaTypes.InputObjectRef<Types, T>
{
  override kind = 'InputObject' as const;

  [inputShapeKey]!: T;

  private fields = new Set<() => InputFieldMap>();

  constructor(name: string) {
    super('InputObject', name);
  }

  addFields(fields: () => InputFieldMap) {
    this.fields.add(fields);
  }

  getFields(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    config: PothosInputObjectTypeConfig,
    fields = new Map<string, PothosInputFieldConfig<Types>>(),
  ) {
    for (const fieldMap of this.fields) {
      for (const [fieldName, field] of Object.entries(fieldMap())) {
        if (field) {
          if (fields.has(fieldName)) {
            throw new PothosSchemaError(`Duplicate field ${fieldName} on ${config.name}`);
          }

          fields.set(
            fieldName,
            (field as InputFieldRef<Types>).getConfig(builder, fieldName, config),
          );
        }
      }
    }

    return fields;
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

// @ts-nocheck
import type SchemaBuilder from '../builder.ts';
import { PothosSchemaError } from '../errors.ts';
import { inputFieldShapeKey, PothosFieldConfig, PothosTypeConfig, SchemaTypes } from '../types/index.ts';
import { inputTypeFromParam } from '../utils/index.ts';
export default class ArgumentRef<Types extends SchemaTypes, T = unknown> {
    builder: SchemaBuilder<Types>;
    kind = "Arg" as const;
    fieldName?: string;
    options: PothosSchemaTypes.InputObjectFieldOptions<Types> | null;
    [inputFieldShapeKey]!: T;
    constructor(builder: SchemaBuilder<Types>, options: PothosSchemaTypes.ArgFieldOptions<Types> | null = null) {
        this.builder = builder;
        this.options = options;
    }
    getConfig(name: string, field: string, typeConfig: PothosTypeConfig): PothosFieldConfig<Types> {
        if (!this.options) {
            throw new PothosSchemaError(`Argument ${name} of field ${typeConfig.name}.${field} has not been implemented`);
        }
        return {
            name,
            parentField: field,
            kind: this.kind,
            graphqlKind: this.kind,
            parentType: typeConfig.name,
            type: inputTypeFromParam<Types>(this.options.type, this.builder.configStore, this.options.required ?? this.builder.defaultInputFieldRequiredness),
            pothosOptions: this.options,
            description: this.options.description,
            deprecationReason: this.options.deprecationReason,
            defaultValue: this.options.defaultValue,
            extensions: this.options.extensions,
        };
    }
}

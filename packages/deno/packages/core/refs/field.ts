// @ts-nocheck
import { defaultFieldResolver } from 'https://cdn.skypack.dev/graphql?dts';
import type SchemaBuilder from '../builder.ts';
import { PothosSchemaError } from '../errors.ts';
import { FieldKind, FieldNullability, FieldOptionsFromKind, InputFieldMap, outputFieldShapeKey, PothosFieldConfig, PothosInputFieldConfig, PothosTypeConfig, SchemaTypes, TypeParam, } from '../types/index.ts';
import { typeFromParam } from '../utils/index.ts';
export default class FieldRef<Types extends SchemaTypes, T = unknown, Kind extends FieldKind = FieldKind> {
    builder: SchemaBuilder<Types>;
    kind: FieldKind;
    fieldName?: string;
    [outputFieldShapeKey]!: T;
    private options: FieldOptionsFromKind<Types, unknown, TypeParam<Types>, FieldNullability<TypeParam<Types>>, InputFieldMap, Kind, unknown, unknown> | null;
    constructor(builder: SchemaBuilder<Types>, kind: Kind, options: FieldOptionsFromKind<Types, T, TypeParam<Types>, FieldNullability<TypeParam<Types>>, InputFieldMap, Kind, unknown, unknown> | null = null) {
        this.builder = builder;
        this.kind = kind;
        // TODO: figure out how to make this non-generic while still being compatible with FieldMaps
        this.options = options as never;
    }
    getConfig(name: string, typeConfig: PothosTypeConfig): PothosFieldConfig<Types> {
        const { options } = this;
        if (!options) {
            throw new PothosSchemaError(`Field ${typeConfig.name}.${name} has not been implemented`);
        }
        const args: Record<string, PothosInputFieldConfig<Types>> = {};
        if (options.args) {
            Object.keys(options.args).forEach((argName) => {
                const argRef = options.args![argName];
                args[argName] = this.builder.configStore.createFieldConfig(argRef, argName, typeConfig, name, "Arg");
            });
        }
        let resolve = (options as {
            resolve?: (...argList: unknown[]) => unknown;
        }).resolve ??
            (() => {
                throw new PothosSchemaError(`Not implemented: No resolver found for ${typeConfig.name}.${name}`);
            });
        if (options.extensions?.pothosExposedField === name) {
            resolve = defaultFieldResolver as typeof resolve;
        }
        const { subscribe } = options as {
            subscribe?: (...argList: unknown[]) => unknown;
        };
        return {
            kind: this.kind as never,
            graphqlKind: typeConfig.graphqlKind as "Object" | "Interface",
            parentType: typeConfig.name,
            name,
            args,
            type: typeFromParam(options.type, this.builder.configStore, options.nullable ?? this.builder.defaultFieldNullability),
            pothosOptions: options as never,
            extensions: {
                pothosOriginalResolve: resolve,
                pothosOriginalSubscribe: subscribe,
                ...options.extensions,
            },
            description: options.description,
            deprecationReason: options.deprecationReason,
            resolve,
            subscribe,
        };
    }
}

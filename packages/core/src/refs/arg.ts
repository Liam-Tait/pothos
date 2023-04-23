import { PothosSchemaError } from '../errors';
import {
  inputFieldShapeKey,
  PothosInputFieldConfig,
  PothosTypeConfig,
  SchemaTypes,
} from '../types';

export class ArgumentRef<Types extends SchemaTypes, T = unknown> {
  kind = 'Arg' as const;

  fieldName?: string;

  [inputFieldShapeKey]!: T;

  protected pendingActions: ((
    config: PothosInputFieldConfig<Types>,
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
  ) => PothosInputFieldConfig<Types> | void)[] = [];

  private initConfig:
    | ((
        builder: PothosSchemaTypes.SchemaBuilder<Types>,
        name: string,
        field: string,
        typeConfig: PothosTypeConfig,
      ) => PothosInputFieldConfig<Types>)
    | null;

  constructor(
    initConfig:
      | ((
          builder: PothosSchemaTypes.SchemaBuilder<Types>,
          name: string,
          field: string,
          typeConfig: PothosTypeConfig,
        ) => PothosInputFieldConfig<Types>)
      | null = null,
  ) {
    this.initConfig = initConfig;
  }

  onConfig(
    cb: (
      config: PothosInputFieldConfig<Types>,
      builder: PothosSchemaTypes.SchemaBuilder<Types>,
    ) => PothosInputFieldConfig<Types> | void,
  ) {
    this.pendingActions.push(cb);
  }

  getConfig(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    name: string,
    field: string,
    typeConfig: PothosTypeConfig,
  ): PothosInputFieldConfig<Types> {
    if (!this.initConfig) {
      throw new PothosSchemaError(
        `Argument ${name} of field ${typeConfig.name}.${field} has not been implemented`,
      );
    }

    return this.pendingActions.reduce(
      (config, cb) => cb(config, builder) ?? config,
      this.initConfig(builder, name, field, typeConfig),
    );
  }
}

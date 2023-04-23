import { PothosSchemaError } from '../errors';
import {
  inputFieldShapeKey,
  PothosFieldConfig,
  PothosInputFieldConfig,
  PothosTypeConfig,
  SchemaTypes,
} from '../types';

export class InputFieldRef<Types extends SchemaTypes, T = unknown> {
  kind = 'InputObject' as const;

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
        typeConfig: PothosTypeConfig,
      ) => PothosInputFieldConfig<Types>)
    | null;

  constructor(
    initConfig:
      | ((
          builder: PothosSchemaTypes.SchemaBuilder<Types>,
          name: string,
          typeConfig: PothosTypeConfig,
        ) => PothosInputFieldConfig<Types>)
      | null,
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
    typeConfig: PothosTypeConfig,
  ): PothosFieldConfig<Types> {
    if (!this.initConfig) {
      throw new PothosSchemaError(`Field ${typeConfig.name}.${name} has not been implemented`);
    }

    return this.pendingActions.reduce(
      (config, cb) => cb(config, builder) ?? config,
      this.initConfig(builder, name, typeConfig),
    );
  }
}

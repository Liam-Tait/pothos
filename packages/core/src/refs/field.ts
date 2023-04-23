import { PothosSchemaError } from '../errors';
import {
  FieldKind,
  outputFieldShapeKey,
  PothosOutputFieldConfig,
  PothosTypeConfig,
  SchemaTypes,
} from '../types';

export class FieldRef<Types extends SchemaTypes, T = unknown, Kind extends FieldKind = FieldKind> {
  kind: FieldKind;

  [outputFieldShapeKey]!: T;

  protected pendingActions: ((
    config: PothosOutputFieldConfig<Types>,
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
  ) => PothosOutputFieldConfig<Types> | void)[] = [];

  private initConfig:
    | ((
        builder: PothosSchemaTypes.SchemaBuilder<Types>,
        name: string,
        typeConfig: PothosTypeConfig,
      ) => PothosOutputFieldConfig<Types>)
    | null;

  constructor(
    kind: Kind,
    initConfig:
      | ((
          builder: PothosSchemaTypes.SchemaBuilder<Types>,
          name: string,
          typeConfig: PothosTypeConfig,
        ) => PothosOutputFieldConfig<Types>)
      | null = null,
  ) {
    this.kind = kind;
    this.initConfig = initConfig;
  }

  onConfig(
    cb: (
      config: PothosOutputFieldConfig<Types>,
      builder: PothosSchemaTypes.SchemaBuilder<Types>,
    ) => PothosOutputFieldConfig<Types> | void,
  ) {
    this.pendingActions.push(cb);
  }

  getConfig(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    name: string,
    typeConfig: PothosTypeConfig,
  ): PothosOutputFieldConfig<Types> {
    if (!this.initConfig) {
      throw new PothosSchemaError(`Field ${typeConfig.name}.${name} has not been implemented`);
    }

    const config = this.initConfig(builder, name, typeConfig);

    return this.pendingActions.reduce((cfg, cb) => cb(cfg, builder) ?? cfg, config);
  }
}

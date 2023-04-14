/* eslint-disable max-classes-per-file */

import {
  InterfaceParam,
  InterfaceTypeOptions,
  OutputRef,
  outputShapeKey,
  parentShapeKey,
  PothosInterfaceTypeConfig,
  SchemaTypes,
} from '../types';
import BaseTypeRef from './base';

export default class InterfaceRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types, PothosInterfaceTypeConfig>
  implements OutputRef, PothosSchemaTypes.InterfaceRef<Types, T, P>
{
  override kind = 'Interface' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) {
    super(builder, 'Interface', name);
  }
}

export class ImplementableInterfaceRef<
  Types extends SchemaTypes,
  Shape,
  Parent = Shape,
> extends InterfaceRef<Types, Shape, Parent> {
  implement<Interfaces extends InterfaceParam<Types>[]>(
    options: InterfaceTypeOptions<
      Types,
      ImplementableInterfaceRef<Types, Shape, Parent>,
      Parent,
      Interfaces
    >,
  ) {
    return this.builder.interfaceType(this, options);
  }
}

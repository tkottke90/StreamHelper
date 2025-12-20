
/**
 * Generic type to create optional filters for Prisma models, excluding specified keys.
 *
 * This allows DAO methods to accept additional filter criteria while preventing
 * filtering on keys that are already required parameters.
 *
 * @template TWhereInput - The Prisma WhereInput type (e.g., Prisma.UserGameWhereInput)
 * @template TOmitKeys - Keys to exclude from the filter (e.g., 'id' | 'ownerId')
 *
 * @example
 * ```typescript
 * async findById(
 *   id: number,
 *   ownerId: number,
 *   filter?: OptionalFilters<Prisma.UserGameWhereInput, 'id' | 'ownerId'>
 * ) {
 *   const game = await this.model.findFirst({
 *     where: { id, ownerId, ...filter }
 *   });
 *   return game;
 * }
 * ```
 */
export type OptionalFilters<
  TWhereInput,
  TOmitKeys extends keyof TWhereInput = never
> = Omit<TWhereInput, TOmitKeys>;

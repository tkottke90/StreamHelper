import Database from "@tauri-apps/plugin-sql";
import { z } from 'zod'

const SafeDate = z.coerce.date().default(() => new Date())

type Query<Schema, SchemaKeys = keyof Schema> =
  Partial<Schema> &
  {
    [x: string]: any;
    limit?: number;
    offset?: number;
    order?: SchemaKeys;
    select?: SchemaKeys[]
  }

const TableSchema = {
  id: z.coerce.number().positive(),
  createdAt: SafeDate,
  updatedAt: SafeDate,
  deletedAt: z.coerce.date().optional()
}

export type BaseTableSchema = typeof TableSchema

export class Entity<
  Schema extends z.ZodRawShape,
  EntityDTO = z.infer<z.ZodObject<Schema & BaseTableSchema>>,
  CreateDTO = z.infer<z.ZodObject<Schema>>,
  UpdateDTO = z.infer<z.ZodObject<Schema>>
> {
  protected readonly schema: z.ZodObject<Schema & BaseTableSchema>;
  protected readonly createSchema: z.ZodObject<Schema>;
  protected readonly updateSchema: z.ZodObject<{ [k in keyof Schema]: z.ZodOptional<Schema[k]> }>;


  constructor(
    private readonly db: Promise<Database>,
    private readonly tableName: string | Promise<string>,
    schema: Schema
  ) {

    this.schema = z.object(Entity.createEntitySchema(schema));
    this.createSchema = z.object(schema)
    this.updateSchema = z.object(schema).partial();
  }

  async create(newEntity: CreateDTO) {
    const parsedData = this.createSchema.safeParse(newEntity);

    if (!parsedData.data || parsedData.error) {
      throw new Error('Data Error: Invalid/Missing Data');
    }

    const { fieldsStr, placeholderStr, args } = this.generateFieldPlaceholders(parsedData.data)

    const db = await this.db;
    return await db.execute(
      `INSERT into ${await this.tableName} (${fieldsStr} VALUES (${placeholderStr})) RETURNING *`,
      args
    )
  }

  async createIfMissing(newEntity: CreateDTO) {
    const parsedData = this.createSchema.safeParse(newEntity);

    if (!parsedData.data || parsedData.error) {
      throw new Error('Data Error: Invalid/Missing Data');
    }

    const { fieldsStr, placeholderStr, args } = this.generateFieldPlaceholders(parsedData.data)

    const db = await this.db;
    return await db.execute(
      `INSERT OR IGNORE into ${await this.tableName} (${fieldsStr} VALUES (${placeholderStr}))`,
      args
    )
  }

  async delete(id: number) {
    const db = await this.db;
    await db.execute(
      `UPDATE ${await this.tableName} SET deletedAt = ${new Date().toISOString()} WHERE id = $1;`,
      [id]
    );
  }

  async select(query: Query<EntityDTO>) {
    const where = [];
    const args = [];

    let limit = '';
    let offset = '';
    let order = '';

    for (let key in query) {
      const argIndex = `$${args.push(query[key]) - 1}`;

      if (key === 'limit') {
        limit = `LIMIT $${argIndex}`
        continue;
      }

      if (key === 'offset') {
        if (!limit) {
          limit = 'LIMIT -1'
        }

        offset = `OFFSET $${argIndex}`
        continue
      }

      if (key === 'order') {
        order = `ORDER BY $${argIndex}`
      }

      where.push(
        this.matchOperator(key, argIndex)
      )
    }

    // Append this statement to respect soft deletion
    if ('deletedAt' in query) {
      where.push('deletedAt != NULL')
    }

    const db = await this.db;
    const results = await db.select<EntityDTO[]>(
      `SELECT * from ${await this.tableName} ${where.join(' AND ')} ${order} ${limit} ${offset};`,
      args
    )

    return results.map(result => {
      return this.schema.parse(result)
    })
  }

  async update(id: number, updates: UpdateDTO) {
    const parsedData = this.updateSchema.safeParse(updates);

    if (!parsedData.data || parsedData.error) {
      throw new Error('Data Error: Invalid/Missing Data');
    }

    const { fields, placeholders, args } = this.generateFieldPlaceholders(parsedData.data)

    const setStatements = fields.map((field, index) => {
      return `${field} = ${placeholders[index]}`
    })

    setStatements.push(`updatedAt = ${new Date().toISOString()}`)

    const db = await this.db;
    const results = await db.execute(
      `UPDATE ${await this.tableName} SET ${setStatements.join(',')} WHERE id = $${args.length + 1} RETURNING *;`,
      [...args, id]
    );

    return results;
  }

  private equalityCheck(key: string, value: string, operator: '=' | '!=' = '=') {
    return `${key} ${operator} ${value}`;
  }
  
  private generateFieldPlaceholders<T extends Record<string, any>>(data: T) {
    const fields = [];
    const placeholders = [];
    const args = [];

    Object.keys(data)

    for (let key in data) {
      const index = fields.push(key);
      placeholders.push(`$${index}`);

      // Asserting the existence of data here because the
      // conditional would fail if data was undefined.
      args.push(data[key])
    }

    return {
      fieldsStr: fields.join(','),
      placeholderStr: placeholders.join(','),
      args,
      fields,
      placeholders
    }
  }
  
  private matchOperator(key: string, value: string) {
    switch(value) {

      case '[ne]': {
        return this.equalityCheck(key, value, '!=');
      }
      default: {
        return this.equalityCheck(key, value);
      }
    }
  }

  static createEntitySchema<EntitySchema extends z.ZodRawShape>(schema: EntitySchema) {
    return Object.assign(TableSchema, schema);
  }
}
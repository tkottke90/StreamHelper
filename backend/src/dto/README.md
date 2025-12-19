# Data Transfer Objects (DTOs)

Data Transfer Objects (DTOs) are used to define the shape of data that is transferred between different parts of the application.  This includes data sent to and from the database, data sent to and from the API, and data sent to and from the client.  DTOs are defined using [Zod](https://zod.dev/) which provides a robust type system for validation and parsing.  DTOs are defined in individual files within this directory and are named according to the following convention:

`{EntityName}.dto.ts`

## Naming Conventions

DTOs in this project are developed using `zod`.  Using zod we create a _Schema_, which provides us with validation and mapping capabilities from Zod.  We then create the DTO by inferring the type from the _Schema_.

```ts
const UserSchema = z.object({
  id: z.number(),
  uuid: z.string().uuid(),
  displayName: z.string()
}).required();

export type UserDTO = z.infer<typeof UserCreateSchema>;
```

## DTO Types

We will use the _DTOs_ and _Schemas_ in many places in our application.  As such we may need different properties in different scenarios such as, entity creation, update, and retrieval.  As such we breakup our schemas and combine them using [extend](https://zod.dev/api?id=extend).  All data records we store in our database have the following properties:

- `id` - The primary key for every record
- `createdAt` - The date the record was created
- `updatedAt` - The date the record was last updated

This is encapselated in our `BaseSchema` in the `base.dto.ts` file.  All entities that are stored in the database should extend this schema.  This is done by using the [merge]() function to combine the `BaseSchema` with the entity's specific schema.  For example:

```ts
const UserSchema = BaseSchema.extend(
  z.object({
    uuid: z.string().uuid(),
    displayName: z.string()
  }).sha
);
```

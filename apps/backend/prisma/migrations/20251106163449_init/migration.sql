BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[provider_types] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [jsonSchema] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [provider_types_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [provider_types_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [provider_types_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[providers] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [providerTypeId] INT NOT NULL,
    [specificities] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [providers_status_df] DEFAULT 'active',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [providers_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [providers_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [providers_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [providers_providerTypeId_idx] ON [dbo].[providers]([providerTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [providers_status_idx] ON [dbo].[providers]([status]);

-- AddForeignKey
ALTER TABLE [dbo].[providers] ADD CONSTRAINT [providers_providerTypeId_fkey] FOREIGN KEY ([providerTypeId]) REFERENCES [dbo].[provider_types]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

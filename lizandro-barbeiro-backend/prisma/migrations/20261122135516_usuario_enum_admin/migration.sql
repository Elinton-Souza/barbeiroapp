-- AlterEnum
ALTER TYPE "RoleUsuario" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "nomeBabearia" TEXT,
ALTER COLUMN "role" SET DEFAULT 'CLIENTE';

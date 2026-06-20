-- Add googleId to users table
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- Make passwordHash nullable on candidate_profiles and add googleId
ALTER TABLE "candidate_profiles" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "candidate_profiles" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "candidate_profiles_googleId_key" ON "candidate_profiles"("googleId");

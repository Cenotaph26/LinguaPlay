-- AlterTable: add unique constraint on RolePlayScene.titleEn
CREATE UNIQUE INDEX "RolePlayScene_titleEn_key" ON "RolePlayScene"("titleEn");

-- AlterTable
ALTER TABLE "AiExplanation" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

-- CreateIndex
CREATE UNIQUE INDEX "AiExplanation_symbol_windowStart_locale_key" ON "AiExplanation"("symbol", "windowStart", "locale");
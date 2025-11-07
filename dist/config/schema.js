import { z } from 'zod';
export const RuleTypeSchema = z.enum(['file-exists', 'coverage', 'semver', 'custom']);
export const BaseRuleSchema = z.object({
    name: z.string().min(1),
    type: RuleTypeSchema,
    required: z.boolean().default(true),
    description: z.string().optional(),
});
export const FileExistsRuleSchema = BaseRuleSchema.extend({
    type: z.literal('file-exists'),
    target: z.string().min(1),
});
export const CoverageRuleSchema = BaseRuleSchema.extend({
    type: z.literal('coverage'),
    threshold: z.number().min(0).max(100),
});
export const SemverRuleSchema = BaseRuleSchema.extend({
    type: z.literal('semver'),
    target: z.string().optional().default('package.json'),
});
export const CustomRuleSchema = BaseRuleSchema.extend({
    type: z.literal('custom'),
    script: z.string().min(1),
});
export const RuleSchema = z.discriminatedUnion('type', [
    FileExistsRuleSchema,
    CoverageRuleSchema,
    SemverRuleSchema,
    CustomRuleSchema,
]);
export const ConfigSchema = z.object({
    rules: z.array(RuleSchema).min(1),
    parallel: z.boolean().default(false),
    failFast: z.boolean().default(false),
});

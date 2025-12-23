# GoodsInTransitClaim Refactoring Plan

## Current State
- **2,046 lines** in one file
- Monolithic component with everything mixed together
- Hard to maintain, test, and understand

## Target State
- **Main file: ~200 lines** (orchestrator only)
- **7 section components: ~150 lines each**
- **Custom hooks: ~150 lines**
- **Types file: ~50 lines**
- **Total: Still ~2,000 lines but properly organized**

## New Structure

```
src/
  pages/
    claims/
      GoodsInTransitClaim.tsx (200 lines) - Main orchestrator
      goods-in-transit/
        sections/
          PolicyDetailsSection.tsx (120 lines)
          InsuredDetailsSection.tsx (100 lines)
          LossDetailsSection.tsx (150 lines)
          GoodsItemsSection.tsx (180 lines)
          CircumstancesSection.tsx (200 lines)
          TransportDetailsSection.tsx (150 lines)
          DeclarationSection.tsx (100 lines)
        hooks/
          useGoodsInTransitForm.ts (150 lines)
        types/
          goods-in-transit.types.ts (50 lines)
        schema/
          goods-in-transit.schema.ts (100 lines)
```

## Implementation Steps

1. ✅ Extract types
2. ✅ Extract schema
3. ✅ Extract custom hook
4. ✅ Create section components
5. ✅ Refactor main component
6. ✅ Test everything

## Benefits

- ✅ Each file < 200 lines
- ✅ Easy to find code
- ✅ Easy to test individual sections
- ✅ Reusable components
- ✅ Better TypeScript support
- ✅ Follows React best practices

Let's start!

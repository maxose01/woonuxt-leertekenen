<script setup lang="ts">
import { computed } from 'vue';

interface ProductPriceProps {
  regularPrice?: string | null;
  salePrice?: string | null;
}

const { regularPrice, salePrice } = defineProps<ProductPriceProps>();

const sanitizedRegularPrice = computed(() => {
  return regularPrice ? regularPrice.replace('€', '') : null;
});

const sanitizedSalePrice = computed(() => {
  return salePrice ? salePrice.replace('€', '') : null;
});
</script>

<template>
  <div v-if="regularPrice" class="flex font-semibold">
    <span :class="{ 'text-gray-400 line-through font-normal': salePrice }" v-html="sanitizedRegularPrice" />
    <span v-if="sanitizedSalePrice" class="ml-2" v-html="sanitizedSalePrice" />
  </div>
</template>

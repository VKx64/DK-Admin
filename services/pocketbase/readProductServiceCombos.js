import pb from "./pocketbase";

export async function getProductServiceCombos() {
  try {
    const records = await pocketbase.collection("service_request").getFullList({
      sort: "-created",
    });

    const combos = records.reduce((acc, record) => {
      const key = `${record.product} - ${record.problem}`;
      if (acc[key]) {
        acc[key].count += 1;
      } else {
        acc[key] = {
          product: record.product,
          service: record.problem,
          count: 1,
        };
      }
      return acc;
    }, {});

    const sortedCombos = Object.values(combos).sort((a, b) => b.count - a.count);

    return sortedCombos;
  } catch (error) {
    console.error("Error fetching product-service combos:", error);
    return [];
  }
}

var e=`
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount currencyCode } }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            product { title handle }
          }
        }
      }
    }
  }
`,t=`
  unitPrice { amount currencyCode }
  unitPriceMeasurement { quantityValue quantityUnit referenceValue referenceUnit }
`;`${t}`,`${t}`,`${e}`,`${e}`,`${e}`,`${e}`,`${e}`;
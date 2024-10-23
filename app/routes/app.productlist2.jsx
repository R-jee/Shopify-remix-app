import {Avatar, Card, Layout, Page, ResourceItem, ResourceList, Text} from "@shopify/polaris";
import {TitleBar} from "@shopify/app-bridge-react";
import {authenticate} from "../shopify.server.js";
import {json} from '@remix-run/node';
import {useLoaderData} from "@remix-run/react";
import React, {useState, useEffect} from 'react';
import {DeleteIcon} from '@shopify/polaris-icons';

export const loader = async ({request}) => {
  const {admin} = await authenticate.admin(request);

  const url = new URL(request.url);
  const after = url.searchParams.get('after') || null;

  const response = await admin.graphql(`#graphql
    query ($after: String) {
      products(first: 5, after: $after) {
        edges {
          node {
            id
            title
            description
            handle
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `, {variables: {after}});

  const data = await response.json();

  return json({
    products: data.data.products.edges,
    hasNextPage: data.data.products.pageInfo.hasNextPage,
    endCursor: data.data.products.pageInfo.endCursor,
  });
};

export default function Products() {
  const {products, hasNextPage, endCursor} = useLoaderData();
  const [allProducts, setAllProducts] = useState(products);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    setAllProducts(products);
  }, [products]);

  const resourceName = {
    singular: 'product', plural: 'products',
  };

  const promotedBulkActions = [{
    content: 'Edit products', onAction: () => shopify.toast.show('Bulk edit products'),
  }];

  const bulkActions = [{
    content: 'Add tags', onAction: () => shopify.toast.show('Bulk add tags'),
  }, {
    content: 'Remove tags', onAction: () => shopify.toast.show('Bulk remove tags'),
  }, {
    icon: DeleteIcon, destructive: true, content: 'Delete products', onAction: () => {
      if (selectedItems.length > 0) {
        const selectedIds = selectedItems.join(', ');
        shopify.toast.show(`Deleting products with IDs: ${selectedIds}`);
      } else {
        shopify.toast.show('No products selected for deletion');
      }
    },
  }];

  const handleNextPage = async () => {
    const response = await fetch(`/api/shopify/graphql?after=${endCursor}`);
    const {products: newProducts, hasNextPage: newHasNextPage, endCursor: newEndCursor} = await response.json();
    // Merge new products with the existing products
    setAllProducts(prevProducts => [...prevProducts, ...newProducts]);
  };

  return (<Page>
    <TitleBar title="Product Listing"/>
    <Layout>
      <Layout.Section>
        <Card>
          <ResourceList
            resourceName={resourceName}
            items={allProducts.map(({node}) => ({
              id: node.id,
              title: node.title,
              description: node.description,
              imageUrl: node.images.edges[0]?.node.url || '',
            }))}
            bulkActions={bulkActions}
            promotedBulkActions={promotedBulkActions}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            renderItem={(item) => {
              const {id, title, description, imageUrl} = item;
              const media = <Avatar size="sm" name={title} source={imageUrl}/>;

              return (<ResourceItem
                id={id}
                media={media}
                accessibilityLabel={`View details for ${title}`}
              >
                <h3>
                  <Text fontWeight="bold" as="span">
                    {title}
                  </Text>
                </h3>
                <div>{description}</div>
              </ResourceItem>);
            }}
            pagination={{
              hasNext: hasNextPage, onNext: handleNextPage,
            }}
          />
        </Card>
      </Layout.Section>
    </Layout>
  </Page>);
}

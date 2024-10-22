import {
  Box, Card, Layout, Link, List, Page, Text, BlockStack, Grid,
} from "@shopify/polaris";
import {TitleBar} from "@shopify/app-bridge-react";
import {authenticate} from "../shopify.server.js";
import {json} from '@remix-run/node';
import {useLoaderData} from "@remix-run/react";
import {MediaCard} from '@shopify/polaris';
import React from 'react';

export const loader = async ({request}) => {
  const {admin} = await authenticate.admin(request);

  const response = await admin.graphql(`#graphql
    query getProducts {
      products(first: 10) {
        edges {
          node {
            id
            title
            description
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }`);

  const data = await response.json();

  return json({products: data.data.products.edges});
};

export default function Products() {
  const {products} = useLoaderData();

  return (
    <Page>
      <TitleBar title="Product Listing" />
      <Layout>
        <Layout.Section>
          <Grid>
            {products.map(({node}) => (node.images.edges.map(({node: imageNode}, index) => (
              <Grid.Cell columnSpan={{xs: 12, sm: 12, md: 6, lg: 4, xl: 4}}>
                <MediaCard
                  title={node.title}
                  primaryAction={{
                    content: 'Save',
                  }}
                  secondaryActions={[{
                    content: 'Delete', destructive: true,
                  },]}
                  description={node.description}
                  popoverActions={[{
                    content: 'Dismiss', onAction: () => {
                    }
                  }]}
                  size="small"
                >
                  <img
                    width="100%"
                    height="100%"
                    style={{
                      objectFit: 'contain', objectPosition: 'center',
                    }}
                    src={imageNode.url} alt={'image' + index}
                  />
                </MediaCard>
              </Grid.Cell>
                ))
            ))}
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

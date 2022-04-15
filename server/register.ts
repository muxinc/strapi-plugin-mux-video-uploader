import { addMuxPlaybackUrlFieldsToGraphQlSchema } from './api/mux-playback-url-graphql-fields';

export = async ({ strapi }: { strapi: any }) => {
  const graphQlPlugin = strapi.plugin('graphql');

  if (graphQlPlugin) {
    const graphqlExtensionService = graphQlPlugin.service('extension');
    graphqlExtensionService.use(addMuxPlaybackUrlFieldsToGraphQlSchema);
  }
};

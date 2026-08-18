import { buildCollectionTree as _buildCollectionTree } from "metabase/entities/collections";
import { nonPersonalOrArchivedCollection } from "metabase/collections/utils";

import type {
  Collection,
  CollectionContentModel,
  User,
} from "metabase-types/api";

function getOurAnalyticsCollection(collectionEntity: any) {
  return {
    ...collectionEntity,
    schemaName: "Everything else",
    icon: "folder",
  };
}

export function buildCollectionTree({
  collections,
  rootCollection,
  currentUser,
  targetModel = "question",
}: {
  collections: Collection[];
  rootCollection: Collection | undefined;
  currentUser: User;
  targetModel?: "model" | "question";
}) {
  const preparedCollections: Collection[] = [];
  const nonPersonalOrArchivedCollections = collections.filter(
    nonPersonalOrArchivedCollection,
  );

  preparedCollections.push(...nonPersonalOrArchivedCollections);

  const modelFilter =
    targetModel === "model"
      ? (model: CollectionContentModel) => model === "dataset"
      : (model: CollectionContentModel) => model === "card";

  const tree = _buildCollectionTree(preparedCollections, modelFilter);

  if (rootCollection) {
    tree.unshift(getOurAnalyticsCollection(rootCollection));
  }

  return tree;
}

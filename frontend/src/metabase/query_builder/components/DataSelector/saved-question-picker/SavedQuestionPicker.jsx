import { useMemo, useState, useCallback } from "react";
import _ from "underscore";
import PropTypes from "prop-types";
import { t } from "ttag";
import { connect } from "react-redux";

import { Icon } from "metabase/core/components/Icon";
import { Tree } from "metabase/components/tree";
import Collection, {
  PERSONAL_COLLECTIONS,
  buildCollectionTree,
} from "metabase/entities/collections";
import { nonPersonalOrArchivedCollection } from "metabase/collections/utils";

import SavedQuestionList from "./SavedQuestionList";
import {
  SavedQuestionPickerRoot,
  CollectionsContainer,
  BackButton,
  TreeContainer,
} from "./SavedQuestionPicker.styled";
import { findCollectionByName } from "./utils";

const propTypes = {
  isDatasets: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  collections: PropTypes.array.isRequired,
  currentUser: PropTypes.object.isRequired,
  databaseId: PropTypes.string,
  tableId: PropTypes.string,
  collectionName: PropTypes.string,
  rootCollection: PropTypes.object,
};

const getOurAnalyticsCollection = collectionEntity => {
  return {
    ...collectionEntity,
    schemaName: "Everything else",
    icon: "folder",
  };
};

function SavedQuestionPicker({
  isDatasets,
  onBack,
  onSelect,
  collections,
  currentUser,
  databaseId,
  tableId,
  collectionName,
  rootCollection,
}) {
  const collectionTree = useMemo(() => {
    const modelFilter = isDatasets
      ? model => model === "dataset"
      : model => model === "card";

    const preparedCollections = [];
    const nonPersonalOrArchivedCollections = collections.filter(
      nonPersonalOrArchivedCollection,
    );

    preparedCollections.push(...nonPersonalOrArchivedCollections);

    return [
      ...(rootCollection ? [getOurAnalyticsCollection(rootCollection)] : []),
      ...buildCollectionTree(preparedCollections, modelFilter),
    ];
  }, [collections, rootCollection, isDatasets]);

  const initialCollection = useMemo(
    () =>
      findCollectionByName(collectionTree, collectionName) ?? collectionTree[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [selectedCollection, setSelectedCollection] =
    useState(initialCollection);

  const handleSelect = useCallback(collection => {
    if (collection.id === PERSONAL_COLLECTIONS.id) {
      return;
    }
    setSelectedCollection(collection);
  }, []);

  return (
    <SavedQuestionPickerRoot>
      <CollectionsContainer>
        <BackButton onClick={onBack}>
          <Icon name="chevronleft" className="mr1" />
          {isDatasets ? t`Models` : t`Saved Questions`}
        </BackButton>
        <TreeContainer>
          <Tree
            data={collectionTree}
            onSelect={handleSelect}
            selectedId={selectedCollection?.id}
          />
        </TreeContainer>
      </CollectionsContainer>
      <SavedQuestionList
        isDatasets={isDatasets}
        collection={selectedCollection}
        selectedId={tableId}
        databaseId={databaseId}
        onSelect={onSelect}
      />
    </SavedQuestionPickerRoot>
  );
}

SavedQuestionPicker.propTypes = propTypes;

const mapStateToProps = ({ currentUser }) => ({ currentUser });

export default _.compose(
  Collection.load({
    id: () => "root",
    entityAlias: "rootCollection",
    loadingAndErrorWrapper: false,
  }),
  Collection.loadList({
    query: () => ({ tree: true, "exclude-archived": true }),
  }),
  connect(mapStateToProps),
)(SavedQuestionPicker);

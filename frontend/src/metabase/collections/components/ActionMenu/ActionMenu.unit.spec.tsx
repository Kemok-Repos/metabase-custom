import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "__support__/ui";
import { Bookmark, Collection, CollectionItem } from "metabase-types/api";
import {
  createMockCollection,
  createMockCollectionItem,
  createMockUser,
} from "metabase-types/api/mocks";
import { createMockState } from "metabase-types/store/mocks";
import ActionMenu from "./ActionMenu";

interface SetupOpts {
  item: CollectionItem;
  collection?: Collection;
  bookmarks?: Bookmark[];
  isAdmin?: boolean;
}

const setup = ({
  item,
  collection = createMockCollection({ can_write: true }),
  bookmarks,
  isAdmin = false,
}: SetupOpts) => {
  const onCopy = jest.fn();
  const onMove = jest.fn();
  const createBookmark = jest.fn();
  const deleteBookmark = jest.fn();

  renderWithProviders(
    <ActionMenu
      item={item}
      collection={collection}
      bookmarks={bookmarks}
      onCopy={onCopy}
      onMove={onMove}
      createBookmark={createBookmark}
      deleteBookmark={deleteBookmark}
    />,
    {
      storeInitialState: createMockState({
        currentUser: createMockUser({ is_superuser: isAdmin }),
      }),
    },
  );

  return { onCopy, onMove, createBookmark, deleteBookmark };
};

describe("ActionMenu", () => {
  it("should show an option to hide preview for a pinned question", () => {
    const item = createMockCollectionItem({
      model: "card",
      collection_position: 1,
      collection_preview: true,
      setCollectionPreview: jest.fn(),
    });

    setup({ item });

    userEvent.click(screen.getByLabelText("ellipsis icon"));
    userEvent.click(screen.getByText("Don’t show visualization"));

    expect(item.setCollectionPreview).toHaveBeenCalledWith(false);
  });

  it("should show an option to show preview for a pinned question", () => {
    const item = createMockCollectionItem({
      model: "card",
      collection_position: 1,
      collection_preview: false,
      setCollectionPreview: jest.fn(),
    });

    setup({ item });

    userEvent.click(screen.getByLabelText("ellipsis icon"));
    userEvent.click(screen.getByText("Show visualization"));

    expect(item.setCollectionPreview).toHaveBeenCalledWith(true);
  });

  it("should not show an option to hide preview for a pinned model", () => {
    setup({
      item: createMockCollectionItem({
        model: "dataset",
        collection_position: 1,
        setCollectionPreview: jest.fn(),
      }),
    });

    userEvent.click(screen.getByLabelText("ellipsis icon"));

    expect(
      screen.queryByText("Don’t show visualization"),
    ).not.toBeInTheDocument();
  });

  it("should allow to move and archive regular collections", () => {
    const item = createMockCollectionItem({
      name: "Collection",
      model: "collection",
      setCollection: jest.fn(),
      setArchived: jest.fn(),
    });

    const { onMove } = setup({ item });

    userEvent.click(screen.getByLabelText("ellipsis icon"));
    userEvent.click(screen.getByText("Move"));
    expect(onMove).toHaveBeenCalledWith([item]);

    userEvent.click(screen.getByLabelText("ellipsis icon"));
    userEvent.click(screen.getByText("Archive"));
    expect(item.setArchived).toHaveBeenCalledWith(true);
  });

  it("should not allow to move and archive personal collections", () => {
    const item = createMockCollectionItem({
      name: "My personal collection",
      model: "collection",
      personal_owner_id: 1,
      setCollection: jest.fn(),
      setArchived: jest.fn(),
    });

    setup({ item });

    userEvent.click(screen.getByLabelText("ellipsis icon"));
    expect(screen.queryByText("Move")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
  });

  describe("bookmarking a card", () => {
    it("should not offer to bookmark a card for regular users", () => {
      const item = createMockCollectionItem({ model: "card" });

      setup({ item, bookmarks: [], isAdmin: false });

      userEvent.click(screen.getByLabelText("ellipsis icon"));
      expect(screen.queryByText("Bookmark")).not.toBeInTheDocument();
    });

    it("should offer to bookmark a card for admins", () => {
      const item = createMockCollectionItem({ model: "card" });

      const { createBookmark } = setup({ item, bookmarks: [], isAdmin: true });

      userEvent.click(screen.getByLabelText("ellipsis icon"));
      userEvent.click(screen.getByText("Bookmark"));
      expect(createBookmark).toHaveBeenCalledWith(String(item.id), "card");
    });

    it("should still offer to bookmark a dashboard for regular users", () => {
      const item = createMockCollectionItem({ model: "dashboard" });

      setup({ item, bookmarks: [], isAdmin: false });

      userEvent.click(screen.getByLabelText("ellipsis icon"));
      expect(screen.getByText("Bookmark")).toBeInTheDocument();
    });
  });
});

import React from "react";
import fetchMock from "fetch-mock";
import userEvent from "@testing-library/user-event";

import { renderWithProviders, screen } from "__support__/ui";
import { setupDatabasesEndpoints } from "__support__/server-mocks";

import type { Database } from "metabase-types/api";
import {
  createMockCard,
  createMockDatabase,
  createMockUser,
} from "metabase-types/api/mocks";
import { createMockState } from "metabase-types/store/mocks";

import NewItemMenu from "./NewItemMenu";

jest.mock(
  "metabase/actions/containers/ActionCreator",
  () =>
    function ActionCreator() {
      return <div data-testid="mock-action-editor" />;
    },
);

console.warn = jest.fn();
console.error = jest.fn();

type SetupOpts = {
  databases?: Database[];
  hasModels?: boolean;
  isAdmin?: boolean;
  openMenu?: boolean;
};

const SAMPLE_DATABASE = createMockDatabase({
  id: 1,
  engine: "postgres",
  name: "Sample Database",
  native_permissions: "write",
  is_sample: true,
  settings: null,
});

const DB_WITH_ACTIONS = createMockDatabase({
  id: 2,
  name: "Postgres with actions",
  engine: "postgres",
  native_permissions: "write",
  settings: { "database-enable-actions": true },
});

const DB_WITHOUT_WRITE_ACCESS = createMockDatabase({
  ...DB_WITH_ACTIONS,
  id: 3,
  native_permissions: "none",
});

function setup({
  databases = [SAMPLE_DATABASE, DB_WITH_ACTIONS],
  hasModels = true,
  isAdmin = true,
  openMenu = true,
}: SetupOpts = {}) {
  const models = hasModels ? [createMockCard({ dataset: true })] : [];

  setupDatabasesEndpoints(databases);

  fetchMock.get(
    {
      url: "path:/api/search",
    },
    {
      available_models: ["dataset"],
      models: ["dataset"],
      data: models,
      total: models.length,
    },
  );

  renderWithProviders(<NewItemMenu trigger={<button>New</button>} />, {
    storeInitialState: createMockState({
      currentUser: createMockUser({ is_superuser: isAdmin }),
    }),
  });

  if (openMenu) {
    userEvent.click(screen.getByText("New"));
  }
}

describe("NewItemMenu", () => {
  describe("New Action", () => {
    it("should open action editor on click", async () => {
      setup();

      userEvent.click(await screen.findByText("Action"));
      const modal = screen.getByRole("dialog");

      expect(modal).toBeVisible();
    });

    it("should not be visible if there are no databases with actions enabled", () => {
      setup({ databases: [SAMPLE_DATABASE] });
      expect(screen.queryByText("Action")).not.toBeInTheDocument();
    });

    it("should not be visible if user has no models", () => {
      setup({ hasModels: false });
      expect(screen.queryByText("Action")).not.toBeInTheDocument();
    });

    it("should not be visible if user has no write data access", () => {
      setup({ databases: [DB_WITHOUT_WRITE_ACCESS] });
      expect(screen.queryByText("Action")).not.toBeInTheDocument();
    });
  });

  describe("dashboards and collections", () => {
    it("should be creatable by admins", () => {
      setup({ isAdmin: true });

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Collection")).toBeInTheDocument();
    });

    it("should not be creatable by regular users", async () => {
      // el botón aparece cuando cargan las bases: un usuario normal con acceso
      // a datos sigue teniendo "Question", pero ya no "Dashboard" ni "Collection"
      setup({ isAdmin: false, openMenu: false });
      userEvent.click(await screen.findByText("New"));

      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
      expect(screen.queryByText("Collection")).not.toBeInTheDocument();
    });

    it("should hide the menu when a regular user has nothing left to create", () => {
      setup({
        isAdmin: false,
        databases: [DB_WITHOUT_WRITE_ACCESS],
        hasModels: false,
        openMenu: false,
      });

      expect(screen.queryByText("New")).not.toBeInTheDocument();
    });
  });
});

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import { playerAPI } from '../lib/auth';
import { Player } from '../lib/api';

export const PlayersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State for pagination, search, and sorting
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Fetch players
  const {
    data: playersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["players", debouncedSearch, page, limit, sortBy, sortOrder],
    queryFn: () => playerAPI.getPlayers(debouncedSearch, page, limit, sortBy, sortOrder),
  });

  // Mutations
  const createPlayerMutation = useMutation({
    mutationFn: playerAPI.createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setShowAddModal(false);
      setFormData({ name: "", email: "", phone: "" });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      playerAPI.updatePlayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setShowEditModal(false);
      setSelectedPlayer(null);
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: playerAPI.deletePlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setShowDeleteModal(false);
      setSelectedPlayer(null);
    },
  });

  const handleAddPlayer = () => {
    createPlayerMutation.mutate(formData);
  };

  const handleEditPlayer = () => {
    if (selectedPlayer) {
      updatePlayerMutation.mutate({
        id: selectedPlayer.id,
        data: formData,
      });
    }
  };

  const handleDeletePlayer = () => {
    if (selectedPlayer) {
      deletePlayerMutation.mutate(selectedPlayer.id);
    }
  };

  const openEditModal = (player: Player) => {
    setSelectedPlayer(player);
    setFormData({
      name: player.name,
      email: player.email || "",
      phone: player.phone || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (player: Player) => {
    setSelectedPlayer(player);
    setShowDeleteModal(true);
  };

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  }, []);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1); // Reset to first page on sort
  };

  const pagination = playersData?.pagination;
  const players = playersData?.players || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Players Management
              </h1>
              {pagination && (
                <p className="text-sm text-gray-600 mt-1">
                  Total Players: <span className="font-semibold">{pagination.total}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Player
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search Players
                </label>
                <input
                  type="text"
                  id="search"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search by name, email, or phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              Error loading players: {error.message}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <>
              {/* Players Table */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        onClick={() => handleSort("name")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Name{" "}
                        {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th
                        onClick={() => handleSort("createdAt")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Created At{" "}
                        {sortBy === "createdAt" &&
                          (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {players.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          {search
                            ? "No players found matching your search."
                            : "No players yet. Create your first player!"}
                        </td>
                      </tr>
                    ) : (
                      players.map((player) => (
                        <tr
                          key={player.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/players/${player.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {player.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {player.email || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {player.phone || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(player.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/players/${player.id}`);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View Stats
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(player);
                              }}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(player);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-white shadow rounded-lg px-4 py-3 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, pagination.total)} of{" "}
                      {pagination.total} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>

                      <span className="text-sm text-gray-700">
                        Page {page} of {pagination.totalPages}
                      </span>

                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Add New Player
              </h3>
            </div>
            <div className="mt-4">
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlayer}
                disabled={createPlayerMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
              >
                {createPlayerMutation.isPending ? "Adding..." : "Add Player"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {showEditModal && selectedPlayer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Edit Player</h3>
            </div>
            <div className="mt-4">
              <div className="mb-4">
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="edit-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="edit-email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="edit-phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPlayer}
                disabled={updatePlayerMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
              >
                {updatePlayerMutation.isPending
                  ? "Updating..."
                  : "Update Player"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlayer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.204V9.204c0-1.537-1.962-3.204-2.502-3.204H6.938C5.398 6 4.444 7.667 4.444 9.204v11.592c0 1.537.962 3.204 2.502 3.204h13.856c1.54 0 2.502-1.667 2.502-3.204V9.204c0-1.537-.962-3.204-2.502-3.204H6.938C5.398 6 4.444 7.667 4.444 9.204v11.592c0 1.537.962 3.204 2.502 3.204h13.856c1.54 0 2.502-1.667 2.502-3.204V9.204c0-1.537-.962-3.204-2.502-3.204H6.938z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Player
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete{" "}
                      <span className="font-medium text-gray-900">
                        {selectedPlayer.name}
                      </span>
                      ? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlayer}
                disabled={deletePlayerMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {deletePlayerMutation.isPending
                  ? "Deleting..."
                  : "Delete Player"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

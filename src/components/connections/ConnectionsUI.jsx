const ConnectionsUI = ({
  connectionType = "lobby", // or "game"
  connections,
  setAddRelayConnections,
  selectedConnectionId,
  setSelectedConnectionId,
  createId,
  setCreateId,
  connectUrl,
  setConnectUrl,
}) => {
  const filteredConnections = Array.from(connections.entries()).filter(
    ([_, conn]) => conn.type === connectionType && conn.readyState === 1
  );

  return (
    <>
      <>
        {/* Create Relay UI */}
        <div className=" w-full text-left">
          <h4 className="text-lg font-semibold mb-2">
            Create {connectionType}:
          </h4>
          <div className="flex flex-wrap gap-2">
            <select
              className="w-52 px-2 py-1 border rounded text-sm"
              value={selectedConnectionId}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
            >
              <option value="">Select Relay</option>
              {filteredConnections.map(([id, conn]) => (
                <option key={id} value={id}>
                  {id} - {conn.url}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="w-36 px-2 py-1 border rounded text-sm"
              placeholder={`${connectionType} ID`}
              value={createId}
              onChange={(e) => setCreateId(e.target.value)}
            />

            <button
              className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-600 hover:text-white transition disabled:opacity-50"
              disabled={!selectedConnectionId || !createId}
              onClick={() => {
                const conn = connections.get(selectedConnectionId);
                if (conn?.readyState === 1) {
                  setAddRelayConnections((prev) => [
                    ...prev,
                    {
                      id: createId,
                      url: conn.url,
                      type: connectionType,
                    },
                  ]);
                }
              }}
            >
              Create
            </button>
          </div>
        </div>

        {/* Manual Connect UI */}
        <div className="w-full text-left">
          <h4 className="text-lg font-semibold mb-2">
            Connect to a {connectionType} manually:
          </h4>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              className="w-72 px-2 py-1 border rounded text-sm"
              placeholder="Relay URL"
              value={connectUrl}
              onChange={(e) => setConnectUrl(e.target.value)}
            />

            <input
              type="text"
              className="w-48 px-2 py-1 border rounded text-sm"
              placeholder={`${connectionType} ID`}
              value={createId}
              onChange={(e) => setCreateId(e.target.value)}
            />

            <button
              className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition"
              onClick={() => {
                if (!connectUrl || !createId) return;
                setAddRelayConnections((prev) => [
                  ...prev,
                  { id: createId, url: connectUrl, type: connectionType },
                ]);
                setConnectUrl("");
                setCreateId("");
              }}
            >
              Connect
            </button>
          </div>
        </div>
      </>
    </>
  );
};

export default ConnectionsUI;

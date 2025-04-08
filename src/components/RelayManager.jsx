import React, { useCallback, useEffect, useRef, useState } from "react";
import RelayItem from "./RelayItem";

const RelayManager = ({
  setAddRelayConnections,
  addRelayConnections,
  onMessage,
  setSendMessage,
  connections,
  setConnections,
  removeRelayConnections,
  setRemoveRelayConnections,
  selectedRelayId,
  setSelectedRelayId,
}) => {
  const [closingConnections, setClosingConnections] = useState(new Map());
  const manualCloseRefs = useRef({});

  const sendMessageToRelay = useCallback(
    (id, message) => {
      const conn = connections.get(id);
      conn?.sendJsonMessage?.(message);
    },
    [connections]
  );

  useEffect(() => {
    setSendMessage(() => sendMessageToRelay);
  }, [sendMessageToRelay, setSendMessage]);

  useEffect(() => {
    console.log("addRelayConnections", addRelayConnections);
    if (!Array.isArray(addRelayConnections) || addRelayConnections.length === 0)
      return;

    setConnections((prev) => {
      const updated = new Map(prev);
      addRelayConnections.forEach((relay) => {
        console.log("Adding relay connection", relay);
        if (!updated.has(relay.id)) {
          updated.set(relay.id, { ...relay }); // placeholder only
        }
      });
      return updated;
    });

    setAddRelayConnections([]);
  }, [addRelayConnections]);

  useEffect(() => {
    if (removeRelayConnections?.length) {
      removeRelayConnections.forEach((id) => {
        manualCloseRefs.current[id] = { current: true };

        setClosingConnections((prev) => {
          const updated = new Map(prev);
          updated.set(id, { countdown: 5 });
          return updated;
        });

        setTimeout(() => {
          setConnections((prev) => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
          });

          setClosingConnections((prev) => {
            const updated = new Map(prev);
            updated.delete(id);
            return updated;
          });
        }, 5000);
      });

      setRemoveRelayConnections([]);
    }
  }, [removeRelayConnections, setConnections, setRemoveRelayConnections]);

  useEffect(() => {
    if (connections && connections.size > 0 && !selectedRelayId) {
      const firstRelayId = connections.keys().next().value;
      setSelectedRelayId(firstRelayId);
    }
  }, [connections, selectedRelayId, setSelectedRelayId]);

  useEffect(() => {
    if (selectedRelayId && !connections.has(selectedRelayId)) {
      const nextId = connections.keys().next().value || null;
      setSelectedRelayId(nextId);
    }
  }, [connections, selectedRelayId, setSelectedRelayId]);

  return (
    <div className="relay-container d-flex flex-wrap gap-2">
      {Array.from(connections.values()).map((relay) => (
        <RelayItem
          key={relay.id}
          {...relay}
          onMessage={onMessage}
          setConnections={setConnections}
          sendMessageToRelay={sendMessageToRelay}
          closingConnections={closingConnections}
          manualCloseRef={manualCloseRefs.current[relay.id]}
          setRemoveRelayConnections={setRemoveRelayConnections}
          setClosingConnections={setClosingConnections}
          selectedRelayId={selectedRelayId}
          setSelectedRelayId={setSelectedRelayId}
        />
      ))}
    </div>
  );
};

export default RelayManager;

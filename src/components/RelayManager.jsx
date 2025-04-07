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
  const connectionsRef = useRef(new Map());

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

  // useEffect(() => {
  //   console.log("addRelayConnections", addRelayConnections);
  //   addRelayConnections.forEach((relay) => {
  //     const { id } = relay;
  //     if (!connections.has(id)) {
  //       manualCloseRefs.current[id] = { current: false };
  //       // Just insert placeholder with ID (RelayItem will hydrate it)
  //       setConnections((prev) => {
  //         const newMap = new Map(prev);
  //         if (!newMap.has(id)) {
  //           newMap.set(id, { id, ...relay });
  //         }
  //         return newMap;
  //       });
  //     }
  //   });

  //   // if (!addRelayConnections) return;
  //   // if (addRelayConnections?.length) {
  //   //   setConnections((prev) => {
  //   //     const newMap = new Map(prev);
  //   //     addRelayConnections.forEach((relay) => {
  //   //       console.log("Adding relay connection", relay);
  //   //       if (!newMap.has(relay.id)) {
  //   //         manualCloseRefs.current[relay.id] = { current: false };
  //   //         newMap.set(relay.id, relay);
  //   //       }
  //   //     });
  //   //     return newMap;
  //   //   });
  //   // }
  // }, [addRelayConnections, setConnections]);

  // useEffect(() => {
  //   if (!addRelayConnections?.length) return;
  //   console.log("addRelayConnections", addRelayConnections);
  //   addRelayConnections.forEach((relay) => {
  //     console.log("Adding relay connection", relay);
  //     const { id } = relay;

  //     if (!connections.has(id)) {
  //       manualCloseRefs.current[id] = { current: false };

  //       setConnections((prev) => {
  //         const newMap = new Map(prev);
  //         if (!newMap.has(id)) {
  //           newMap.set(id, { id, ...relay });
  //         }
  //         return newMap;
  //       });
  //     }
  //   });
  // }, [addRelayConnections, connections, setConnections]);

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

      {/* {Array.from(connections.values()).map((relay) => (
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
      ))} */}
    </div>
  );
};

export default RelayManager;

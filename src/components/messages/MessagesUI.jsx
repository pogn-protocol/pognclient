import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

const MessagesUI = ({ title = "Messages", messageGroups = [] }) => {
  return (
    <div className="mt-4 w-full">
      <h3 className="font-semibold mb-2">{title}</h3>

      <div className="flex flex-wrap gap-4 justify-between w-full">
        {messageGroups.map(({ title, msgs = [] }, i) => (
          <div
            key={i}
            className="w-full sm:w-[48%] lg:w-[32%] border border-gray-200 rounded-md p-3 bg-white shadow-sm break-all"
          >
            <h4 className="font-bold text-gray-800 mb-2">{title}</h4>

            {msgs.length > 0 ? (
              <>
                {msgs.length > 1 && (
                  <details className="mb-2">
                    <summary className="cursor-pointer  text-blue-600">
                      Previous Messages ({msgs.length - 1})
                    </summary>
                    <div className="mt-1 space-y-1">
                      {msgs.slice(0, -1).map((msg, idx) => (
                        <JsonView
                          key={`msg-${i}-${idx}`}
                          data={msg}
                          shouldExpandNode={() => false}
                          style={{ fontSize: "12px", lineHeight: "1.1" }}
                        />
                      ))}
                    </div>
                  </details>
                )}
                <JsonView
                  data={msgs[msgs.length - 1]}
                  shouldExpandNode={(level, value, field) =>
                    level === 0 || field === "payload"
                  }
                  style={{ fontSize: "12px", lineHeight: "1.2" }}
                />
              </>
            ) : (
              <p className="italic text-gray-500">No messages</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessagesUI;

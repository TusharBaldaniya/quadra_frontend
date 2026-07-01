import React from "react";
import { Draggable } from "@hello-pangea/dnd";

const priorityColors = {
  High: "bg-red-200",
  Medium: "bg-yellow-200",
  Low: "bg-green-200",
};

export default function Task({ task, index }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-2 rounded shadow text-sm sm:text-base ${
            snapshot.isDragging ? "bg-blue-200" : priorityColors[task.priority]
          }`}
        >
          <h3 className="font-bold">{task.title}</h3>
          <p className="text-gray-700 text-xs sm:text-sm">
            Priority: {task.priority}
          </p>
        </div>
      )}
    </Draggable>
  );
}

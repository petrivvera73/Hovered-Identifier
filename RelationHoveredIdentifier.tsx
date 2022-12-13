import React, { useEffect, useState } from 'react';

export interface RelationHoveredIdentifierProps {
  pos: Vector2d;
  width: number;
  color: string;

  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  direction: DragRelationType;
  relation: Relation;
  startPos: Vector2d;
  endPos: Vector2d;
  groupIdx: number;
  toPointOffsetY: number;
  fromPointOffsetY: number;
  group: RelationGroup;
}

const OFFSET = Size.Line;

export const RelationHoveredIdentifier: FC<RelationHoveredIdentifierProps> = (
  pos,
  width: widthProps,
  color,
  onMouseEnter,
  onMouseLeave,
  direction,
  relation,
  startPos,
  endPos,
  groupIdx,
  fromPointOffsetY,
  toPointOffsetY,
  group
) => {
  const ref = useRef<Konva.Rect>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [draggable, setDraggable] = useState(true);

  /** Global Store */
  const { isDebugMode, activeTool, deleteModifierDown, setIsDragging } =
    useTimeLineToolsStore();
  const stageRef = useTimeLineStore((store) => store.stageRef);
  const elements = usePointStore((store) => store.elements);

  /** Utils */
  const { handleDragStartRelation, handleDragEndRelation } =
    useTimeLineRelationUtils();
  const { getBoxSizeWithAllPoint } = useTimeLineQuery();

  /** Local State */
  const { x: boxX, y: boxY, width, height } = getBoxSizeWithAllPoint();
  const [cursorPos, setCursorPos] = useState<Vector2d | null>(null);

  const handleDratStart = (e: KonvaEventObject<DragEvent>) => {
    if (e.evt.which !== 1) return;

    handleDragStartRelation({ id: relation.id, direction });
    handleDragMove();
    setDraggable(false);
    setIsDragging(true);
  };

  const handelDragEnd = (_: unknown, pointId?: string) => {
    handleDragEndRelation(relation.id, pointId);
    setCursorPos(null);
    setDraggable(true);
    setIsDragging(false);
  };

  const handleDragMove = () => {
    setCursorPos(getPointerPosition(stageRef));
  };

  useEffect(() => {
    if (!ref.current) return;
    ref.current.to({
      opacity: isHovered ? 1 : 0,
      height: isHovered ? 4 : 1,
      y: isHovered ? pos.y - 2 : pos.y,
      duration: 0.2,
    });
  }, [color, isHovered, pos.y]);

  const listening =
    draggable && (activeTool.actions.moveRelation || deleteModifierDown);

  return (
    <>
      <Rect
        ref={ref}
        x={pos.x + widthProps / 2 - 7}
        width={14}
        fill={color}
        cornerRadius={8}
        listening={false}
      />
      <Rect
        x={pos.x}
        y={pos.y - Size.LineWidth * 5}
        width={widthProps}
        height={Size.LineWidth * 10}
        fill={isDebugMode ? `${color}4f` : "transparent"}
        onMouseEnter={() => {
          setIsHovered(true);
          if (onMouseEnter) onMouseEnter();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          if (onMouseLeave) onMouseLeave();
        }}
        onDragStart={handleDratStart}
        listening={listening}
        draggable={draggable}
      />
      {!draggable && (
        <>
          <Rect
            x={boxX - OFFSET * 4}
            y={boxY - OFFSET * 4}
            width={width + OFFSET * 8}
            height={height + OFFSET * 8}
            fill={isDebugMode ? "#0000001f" : "transparent"}
            onMouseEnter={() => setCursorPos(null)}
            onMouseUp={handelDragEnd}
          />
          <Rect
            x={boxX - OFFSET}
            y={boxY - OFFSET}
            width={width + OFFSET * 2}
            height={height + OFFSET * 2}
            fill={isDebugMode ? "#0000004f" : "transparent"}
            onMouseMove={handleDragMove}
            onMouseUp={handelDragEnd}
          />
          {cursorPos && (
            <>
              {elements
                .filter(
                  (el) =>
                    (direction === "startLine"
                      ? el.id !== relation.toId
                      : el.id !== relation.fromId) &&
                    el.direction !== Direction.Divider &&
                    el.type === ElementType.Static
                )
                .map((el) => (
                  <Rect
                    key={el.id}
                    x={el.x - Size.Line / 2}
                    y={el.y - Size.Point}
                    width={Size.Line}
                    height={
                      el.height.text + el.height.metadata + Size.Point * 2
                    }
                    fill={isDebugMode ? `${color}4f` : "transparent"}
                    onMouseEnter={() => setCursorPos({ x: el.x, y: el.y })}
                    onMouseUp={() => handelDragEnd({}, el.id)}
                  />
                ))}

              <RelationCreated
                start={direction === "startLine" ? cursorPos : startPos}
                end={direction === "endLine" ? cursorPos : endPos}
                color={ElementColor.Drag}
                groupIdx={groupIdx}
                toPointOffsetY={toPointOffsetY}
                fromPointOffsetY={fromPointOffsetY}
                group={group}
              />
            </>
          )}
        </>
      )}
    </>
  );
};
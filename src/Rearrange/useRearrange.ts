import Animated from 'react-native-reanimated';
import { useValue } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';

const {
  add,
  block,
  useCode,
  call,
  cond,
  eq,
  set,
  Value,
  greaterThan,
} = Animated;

export type Offset = {
  id: Animated.Value<number>;
  x: Animated.Value<number>;
  y: Animated.Value<number>;
  width: Animated.Value<number>;
  height: Animated.Value<number>;
};

export type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const logAction = (actionType: Animated.Value<number>, actionData: Offset) =>
  call(
    [
      actionType,
      actionData.id,
      actionData.x,
      actionData.y,
      actionData.width,
      actionData.height,
    ],
    ([action, id, x, y, width, height]) =>
      console.log({
        action,
        data: {
          id,
          x,
          y,
          width,
          height,
        },
      }),
  );

const log = ([i, id, x, y, width, height]: readonly number[]) => {
  if (x === undefined) {
    console.log({ offsetIndex: i, assignedId: id });
    return;
  }
  console.log({ offsetIndex: i, assignedId: id, x, y, width, height });
};

const logOffset = (offset: Offset, i: number) =>
  call(
    [
      new Animated.Value(i),
      offset.id,
      offset.x,
      offset.y,
      offset.width,
      offset.height,
    ],
    log,
  );
/* eslint-enable @typescript-eslint/no-unused-vars */

const handleRemoveAction = (
  nextOffset: Offset | null,
  offset: Offset,
  inputBoxLayout: Layout,
  action: Animated.Value<number>,
  actionData: Offset,
) => {
  if (nextOffset) {
    return [
      // flag offset as -1, so item on right takes its positions
      cond(eq(offset.id, actionData.id), [set(offset.id, -1)]),
      cond(eq(offset.id, -1), [
        cond(
          greaterThan(add(offset.x, nextOffset.width), inputBoxLayout.width),
          [
            set(offset.y, add(offset.y, actionData.height)),
            set(offset.x, inputBoxLayout.x),
          ],
        ),
        set(offset.width, nextOffset.width),
        set(offset.id, nextOffset.id),
        // there is not other item on right, we can skip executing the rest of items
        cond(eq(nextOffset.id, -1), [set(action, ACTIONS.NONE)]),
        // prepare next offset
        set(nextOffset.id, -1),
        set(nextOffset.x, add(offset.x, offset.width)),
        set(nextOffset.y, offset.y),
      ]),
    ];
  }
  return [set(offset.id, -1), set(action, ACTIONS.NONE)];
};

const handleAddAction = (
  prevOffset: Offset | null,
  offset: Offset,
  inputBoxLayout: Layout,
  action: Animated.Value<number>,
  actionData: Offset,
) => {
  let prevOffsetCalc;
  if (prevOffset) {
    prevOffsetCalc = [
      cond(
        greaterThan(
          add(prevOffset.x, prevOffset.width, actionData.width),
          inputBoxLayout.width,
        ),
        [
          set(offset.y, add(prevOffset.y, actionData.height)),
          set(offset.x, inputBoxLayout.x),
        ],
        [
          set(offset.y, prevOffset.y),
          set(offset.x, add(prevOffset.x, prevOffset.width)),
        ],
      ),
      set(offset.id, actionData.id),
      set(offset.width, actionData.width),
      set(action, ACTIONS.NONE),
    ];
  } else {
    prevOffsetCalc = [
      set(offset.id, actionData.id),
      set(offset.x, inputBoxLayout.x),
      set(offset.y, inputBoxLayout.y),
      set(offset.width, actionData.width),
      set(action, ACTIONS.NONE),
    ];
  }

  return cond(eq(offset.id, -1), prevOffsetCalc);
};

const ACTIONS = {
  NONE: 0,
  ADD: 1,
  REMOVE: 2,
};

export const useRearrange = (
  words: Array<any>,
  inputBoxLayout: Layout,
  callback: (action: number, data: number) => void,
) => {
  const action = useValue(ACTIONS.NONE);
  const actionData = useMemoOne(
    () => ({
      id: new Value(0),
      x: new Value(0),
      y: new Value(0),
      width: new Value(0),
      height: new Value(0),
    }),
    [],
  );
  const offsets = useMemoOne(
    () =>
      words.map(() => ({
        id: new Value(-1),
        x: new Value(0),
        y: new Value(0),
        width: new Value(0),
        height: new Value(0),
      })),
    [],
  );

  const setAction = (actionType: number, layout: Layout, id: number) =>
    block([
      set(action, actionType),
      set(actionData.id, id),
      set(actionData.x, layout.x),
      set(actionData.y, layout.y),
      set(actionData.width, layout.width),
      set(actionData.height, layout.height),
      call([], () => {
        callback(actionType, id);
      }),
    ]);

  const addNodeAction = (layout: Layout, id: number) =>
    setAction(ACTIONS.ADD, layout, id);

  const removeNodeAction = (layout: Layout, id: number) =>
    setAction(ACTIONS.REMOVE, layout, id);

  const mapOffsets = () =>
    block([
      // call([], () => console.log('-----BEFORE-----')),
      // logAction(action, actionData),
      // offsets.map(logOffset),
      offsets.map((offset, index) => {
        const prevOffset = offsets[index - 1] ? offsets[index - 1] : null;
        const nextOffset = offsets[index + 1] ? offsets[index + 1] : null;
        return block([
          cond(
            eq(action, ACTIONS.ADD),
            handleAddAction(
              prevOffset,
              offset,
              inputBoxLayout,
              action,
              actionData,
            ),
          ),
          cond(
            eq(action, ACTIONS.REMOVE),
            handleRemoveAction(
              nextOffset,
              offset,
              inputBoxLayout,
              action,
              actionData,
            ),
          ),
        ]);
      }),
      // call([], () => console.log('-----AFTER-----')),
      // offsets.map(logOffset),
    ]);

  useCode(() => block([mapOffsets()]), [inputBoxLayout]);

  return { offsets, addNodeAction, removeNodeAction };
};

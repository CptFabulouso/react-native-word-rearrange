import { View, ViewStyle, StyleSheet, Text } from "react-native";
import React, { useState } from "react";
import { TapGestureHandler, State } from "react-native-gesture-handler";
import Animated, { Easing } from "react-native-reanimated";
import {
  useValues,
  useGestureHandler,
  withTimingTransition,
} from "react-native-redash";
import { Offset, Layout } from "./useRearrange";

const { block, useCode, sub, set, eq, neq, cond } = Animated;

type WordProps = {
  style?: ViewStyle;
  id: number;
  word: string;
  offsets: Array<Offset>;
  addNode: (layout: Layout, id: number) => Animated.Node<number>;
  removeNode: (layout: Layout, id: number) => Animated.Node<number>;
};

export const WORD_HEIGHT = 30;
export const WORD_SPACING = 6;

const styles = StyleSheet.create({
  container: {
    maxWidth: 120,
    marginRight: 5,
    marginBottom: WORD_SPACING,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    height: WORD_HEIGHT,
    backgroundColor: "green",

    borderColor: "grey",
    borderWidth: 1,
    borderRadius: 12,

    shadowColor: "gray",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    zIndex: 10,
  },
  text: {
    fontWeight: "bold",
    color: "white",
  },
});

const animConfig = {
  duration: 400,
  easing: Easing.out(Easing.exp),
};

const Word = ({ id, word, offsets, addNode, removeNode }: WordProps) => {
  const [layout, setLayout] = useState<any>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [state] = useValues(State.UNDETERMINED);
  const gestureHandler = useGestureHandler({ state });

  const [x, y, offsetX, offsetY, isSelected] = useValues(0, 0, 0, 0, 0);

  useCode(
    () =>
      cond(neq(layout.width, 0), [
        cond(eq(state, State.END), [
          cond(isSelected, [removeNode(layout, id)], [addNode(layout, id)]),
          set(state, State.UNDETERMINED),
        ]),
      ]),
    [layout]
  );

  useCode(
    () =>
      block([
        set(isSelected, 0),
        offsets.map((offset) =>
          block([
            cond(eq(offset.id, id), [
              set(offsetX, offset.x),
              set(offsetY, offset.y),
              set(isSelected, 1),
            ]),
          ])
        ),
        set(x, cond(isSelected, sub(offsetX, layout.x), 0)),
        set(y, cond(isSelected, sub(offsetY, layout.y), 0)),
      ]),
    [offsets, layout.x, layout.y]
  );

  const translateX = withTimingTransition(x, animConfig);
  const translateY = withTimingTransition(y, animConfig);

  return (
    <TapGestureHandler {...gestureHandler}>
      <Animated.View
        // @ts-ignore
        style={{
          transform: [{ translateX }, { translateY }],
        }}
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
      >
        <WordComponent word={word} />
      </Animated.View>
    </TapGestureHandler>
  );
};

const WordComponent = ({ word }: { word: string }) => {
  return (
    <View style={[styles.container]}>
      <Text style={styles.text}>{word}</Text>
    </View>
  );
};

export { Word };

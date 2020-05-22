import { View, StyleSheet } from "react-native";
import React, { useState } from "react";
import { useRearrange } from "./useRearrange";

import { Word } from "./Word";
import words from "./words";

type RearrangeProps = {};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#9c9392",
  },
  wordsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    zIndex: 10,
  },
  inputBox: {
    marginTop: 10,
    backgroundColor: "#e3dddc",
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 0,
  },
});

const Rearrange = ({}: RearrangeProps) => {
  const [wordsSelectLayout, setWordsSelectLayout] = useState<any>(null);
  const [inputBoxLayout, setInputBoxLayout] = useState<any>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const handleActionCallback = (actionType: number, id: number) => {
    console.log("callback", { actionType, id });
  };

  const { offsets, addNodeAction, removeNodeAction } = useRearrange(
    words,
    inputBoxLayout,
    handleActionCallback
  );

  const inputBoxHeight = wordsSelectLayout ? wordsSelectLayout.height + 20 : 0;

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <View
          style={styles.wordsWrapper}
          onLayout={(e) => setWordsSelectLayout(e.nativeEvent.layout)}
        >
          {words.map(({ word, id }) => {
            return (
              <Word
                id={id}
                word={word}
                key={id}
                offsets={offsets}
                addNode={addNodeAction}
                removeNode={removeNodeAction}
              />
            );
          })}
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.inputBox,
            {
              height: inputBoxHeight,
            },
          ]}
          onLayout={(e) => {
            setInputBoxLayout(e.nativeEvent.layout);
          }}
        />
      </View>
    </View>
  );
};

export default Rearrange;

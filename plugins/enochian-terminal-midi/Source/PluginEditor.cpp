#include "PluginEditor.h"

namespace {
void styleKnob(juce::Slider& knob, juce::AudioProcessorValueTreeState& state, const char* id) {
    knob.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
    knob.setTextBoxStyle(juce::Slider::TextBoxBelow, false, 64, 18);
    knob.setColour(juce::Slider::rotarySliderFillColourId, juce::Colour(0xff37d8ff));
    knob.setColour(juce::Slider::thumbColourId, juce::Colour(0xffff9b36));
    knob.setRange(0.0, 1.0);
    knob.getProperties().set("parameter", id);
}
}
EnochianTerminalMidiAudioProcessorEditor::EnochianTerminalMidiAudioProcessorEditor (EnochianTerminalMidiAudioProcessor& p)
 : AudioProcessorEditor (&p), processor(p) {
    setSize (680, 430);
    status.setJustificationType(juce::Justification::centred);
    status.setColour(juce::Label::textColourId, juce::Colour(0xffa8f1ff));
    addAndMakeVisible(status);
    openLiveTerminal.onClick = [] { juce::URL("https://www.chanson-a-repondre-uno.scot/enochian-terminal/").launchInDefaultBrowser(); };
    openLiveTerminal.setColour(juce::TextButton::buttonColourId, juce::Colour(0xff0b4f73));
    openLiveTerminal.setColour(juce::TextButton::textColourOffId, juce::Colour(0xffa8f1ff));
    addAndMakeVisible(openLiveTerminal);
    styleKnob(mix, p.parameters, "mix"); styleKnob(modDepth, p.parameters, "modDepth"); styleKnob(fxMix, p.parameters, "fxMix");
    for (auto* k : {&mix, &modDepth, &fxMix}) addAndMakeVisible(*k);
    startTimerHz(20);
}
void EnochianTerminalMidiAudioProcessorEditor::paint(juce::Graphics& g) {
    g.fillAll(juce::Colour(0xff02070b));
    g.setColour(juce::Colour(0xff0b4f73)); g.drawRect(getLocalBounds(), 2);
    g.setColour(juce::Colour(0xff39c8f5)); g.setFont(24.f);
    g.drawFittedText("ENOCHIAN TERMINAL MIDI", 16, 16, getWidth()-32, 32, juce::Justification::centred, 1);
    g.setFont(12.f); g.setColour(juce::Colour(0xffff9b36));
    g.drawFittedText("MIDI INPUT · 2MIX · 2JESTER", 16, 55, getWidth()-32, 22, juce::Justification::centred, 1);
}
void EnochianTerminalMidiAudioProcessorEditor::resized() {
    status.setBounds(0, 90, getWidth(), 24);
    openLiveTerminal.setBounds(getWidth() / 2 - 150, 340, 300, 34);
    mix.setBounds(110, 140, 140, 180); modDepth.setBounds(270, 140, 140, 180); fxMix.setBounds(430, 140, 140, 180);
}
void EnochianTerminalMidiAudioProcessorEditor::timerCallback() { status.setText(processor.statusText(), juce::dontSendNotification); }
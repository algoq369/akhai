# AkhAI Methodologies - Complete Guide

## Overview

AkhAI implements 7 distinct reasoning methodologies, each optimized for specific query types.

## 1. Direct
**Purpose**: Fast, single-pass responses
**Best For**: Simple factual questions
**Format**: Clear, concise answer

## 2. Chain of Draft (CoD)
**Purpose**: Iterative refinement
**Format**: [DRAFT 1] → [REFLECTION] → [DRAFT 2] → [FINAL ANSWER]
**Best For**: Complex explanations requiring thoroughness

## 3. Buffer of Thoughts (BoT)
**Purpose**: Template-based structured reasoning
**Format**: [BUFFER] → [REASONING] → [VALIDATION] → [ANSWER]
**Best For**: Comparisons, analysis with multiple constraints

## 4. ReAct
**Purpose**: Reasoning with simulated actions
**Format**: [THOUGHT] → [ACTION] → [OBSERVATION] → [FINAL ANSWER]
**Best For**: Research, search queries

## 5. Program of Thought (PoT)
**Purpose**: Code-based computational reasoning
**Format**: [PROBLEM] → [PSEUDOCODE] → [EXECUTION] → [VERIFICATION] → [RESULT]
**Best For**: Math, calculations, logic puzzles

## 6. GTP Consensus
**Purpose**: Multi-perspective analysis
**Format**: [TECHNICAL] → [STRATEGIC] → [CRITICAL] → [SYNTHESIS] → [CONSENSUS]
**Best For**: Complex decisions, opinions

## 7. Auto
**Purpose**: Intelligent routing
**Logic**: Analyzes query and selects optimal methodology automatically

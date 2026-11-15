const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    nodes: {
      type: Array,
      default: []
    },
    edges: {
      type: Array,
      default: []
    },
    viewport: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Workflow', WorkflowSchema);

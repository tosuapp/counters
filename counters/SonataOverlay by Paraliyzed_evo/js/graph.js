// Graph

export function slidingAverageWindowFilter(array, windowSize) {
    const result = new Float64Array(array.length);

    for (let i = 0; i < array.length; i += 1) {
        const left = i - windowSize;
        const from = left >= 0
            ? left
            : 0;
        const to = i + windowSize + 1;

        let count = 0;
        let sum = 0;

        for (let j = from; j < to && j < array.length; j += 1) {
            sum += array[j];
            count++;
        }

        result[i] = sum / count;
    }

    return result;
}

export function toChartData(filterOutput) {
    return Array.from(filterOutput);
}

export function createChartConfig(backgroundColor) {
    return {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    borderColor: 'rgba(0, 0, 0, 1)',
                    borderWidth: "1",
                    backgroundColor,
                    data: [],
                    fill: true,
                }
            ]
        },
        options: {
            tooltips: {
                enabled: false
            },
            legend: {
                display: false,
            },
            elements: {
                line: {
                    tension: 0.4,
                    cubicInterpolationMode: 'monotone'
                },
                point: {
                    radius: 0
                }
            },
            responsive: false,
            scales: {
                x: {
                    display: false,
                },
                y: {
                    display: false,
                }
            }
        }
    };
}

export function createChartConfig2(backgroundColor) {
    return {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    borderColor: 'rgba(100, 100, 100, 0.7)',
                    borderWidth: "1",
                    backgroundColor,
                    data: [],
                    fill: true,
                }
            ]
        },
        options: {
            tooltips: {
                enabled: false
            },
            legend: {
                display: false,
            },
            elements: {
                line: {
                    tension: 0.4,
                    cubicInterpolationMode: 'monotone'
                },
                point: {
                    radius: 0
                }
            },
            responsive: false,
            scales: {
                x: {
                    display: false,
                },
                y: {
                    display: false,
                }
            }
        }
    };
}

// fast-smooth.js

export function max(array, start = 0, end = -1) {
    if (end === -1) {
        end = array.length;
    }

    let maximum = Number.NEGATIVE_INFINITY;

    for (let i = start; i < array.length && i < end; i++) {
        if (maximum < array[i]) {
            maximum = array[i];
        }
    }

    return maximum;
}

function sum(array, start = 0, end = - 1) {
    if (end === -1) {
        end = array.length;
    }

    let s = 0;

    for (let i = start; i < array.length && i < end; i++) {
        s += array[i];
    }

    return s;
}

function mean(array, start = 0, end = -1) {
    return sum(array, start, end) / end;
}

function smooth(array, windowWidth, doSmoothEnds) {
    const width = Math.round(windowWidth);
    if (width <= 1) {
        return new Float64Array(array);
    }

    const half = Math.round(width / 2);
    const ret = new Float64Array(array.length);

    let sumPoints = sum(array, 0, width);
    let i = 0;

    for (; i < array.length - width + 1; i++) {
        ret[i + half - 1] = Math.max(0, sumPoints);
        sumPoints -= array[i];
        sumPoints += array[i + width];
    }

    ret[i + half] = Math.max(0, sum(array, array.length - width + 1, array.length));

    for (let j = 0; j < ret.length; j++) {
        ret[j] /= width;
    }

    if (!doSmoothEnds) {
        return ret;
    }

    const start = (windowWidth + 1) / 2;
    ret[0] = (array[0] + array[1]) / 2;

    for (let j = 1; j < start; j++) {
        ret[j] = Math.max(0, mean(array, 0, 2 * j - 1));
        ret[array.length - j] = Math.max(0, mean(array, array.length - 2 * j + 2, array.length));
    }

    ret[ret.length - 1] = Math.max(0, (array[array.length - 1] + array[array.length - 2]) / 2);

    return ret;
}

export const FAST_SMOOTH_TYPE_NO_SMOOTHING = 0;
export const FAST_SMOOTH_TYPE_RECTANGULAR = 1;
export const FAST_SMOOTH_TYPE_TRIANGULAR = 2;
export const FAST_SMOOTH_TYPE_PSEUDO_GAUSSIAN_3 = 3;
export const FAST_SMOOTH_TYPE_PSEUDO_GAUSSIAN_4 = 4;
export const FAST_SMOOTH_TYPE_MULTIPLE_WIDTH = 5;

export function fastSmooth(array, windowWidth, type = FAST_SMOOTH_TYPE_RECTANGULAR, doSmoothEnds = false) {
    const a = array;
    const w = windowWidth;
    const e = doSmoothEnds;

    switch (type) {
        case FAST_SMOOTH_TYPE_NO_SMOOTHING:
            return new Float64Array(array);

        default:
        case FAST_SMOOTH_TYPE_RECTANGULAR:
            return smooth(a, w, e);

        case FAST_SMOOTH_TYPE_TRIANGULAR:
            return smooth(
                smooth(
                    a, w, e
                ), w, e
            );

        case FAST_SMOOTH_TYPE_PSEUDO_GAUSSIAN_3:
            return smooth(
                smooth(
                    smooth(
                        a, w, e
                    ), w, e
                ), w, e
            );

        case FAST_SMOOTH_TYPE_PSEUDO_GAUSSIAN_4:
            return smooth(
                smooth(
                    smooth(
                        smooth(
                            a, w, e
                        ),
                        w, e
                    ), w, e
                ), w, e
            );

        case FAST_SMOOTH_TYPE_MULTIPLE_WIDTH:
            return smooth(
                smooth(
                    smooth(
                        smooth(
                            a, Math.round(1.6 * w), e
                        ),
                        Math.round(1.4 * w), e
                    ),
                    Math.round(1.2 * w), e
                ), w, e
            );
    }
}
